import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import transporter from '../config/nodemailer.js'
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplate.js'


export const register = async(req,res)=>{
       const {name,email,password} = req.body;
    if(!name || !email || !password){
        return res.json({success:false,message:'missing details'})
    }

    try{
        const existingUser = await userModel.findOne({email})
        if(existingUser){
            return res.json({
                success:false,message:'user already exist'
            })
        }
        const hashedPassword = await bcrypt.hash(password,10);
        
        const user = new userModel({name,email,password:hashedPassword})
        await user.save();
        
        const token= jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:process.env.NODE_ENV === 'production' ?'none':'strict',
            maxAge:7*24*60*60*1000
        })
        //Sending welcome email
        try {
            const mailOptions={
                from:process.env.SENDER_EMAIL,
                to: email,//email will send to user who has created account
                subject:'Welcome to mern authentication',
                text:`Welcome to mern authentication.Your account has been created with
                email id: ${email}`
            }
            //send email
            await transporter.sendMail(mailOptions);
            
            return res.status(201).json({ success: true, message: 'User registered and email sent.' });
    
        } catch (error) {
        // If the email fails to send, log the error
        console.error('Error sending welcome email:', error);

        // Still send a response, but maybe with a note that the email failed
        return res.status(500).json({ success: false, message: 'User registered, but failed to send welcome email.', error: error.message });
    }
 
    }catch(error){
        return res.json({success:false,message:error.message})
    } 

}  
export const login = async (req,res) =>{
    const {email,password} = req.body;
    if(!email || !password){
        return res.json({success:false,message:'Email and password are required'})
    }

    try{
      const user = await userModel.findOne({email})

      if(!user){
        return res.json({success:false,message:'Invalid email'})
      }
      
      const isMatch = await bcrypt.compare(password,user.password)

      if(!isMatch){
        return res.json({success:false,message:'invalid password'})
      }

      const token= jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})
        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production' ?'none':'strict',
            maxAge:7*24*60*60*1000
        })
        return res.json({success:true})
      

    }catch(error){
       return res.json({success:false,message:error.message})
    }
}

export const logout = async(req,res)=>{
    try{
      res.clearCookie('token',{
        httpOnly:true,
        secure:process.env.NODE_ENV==='production',
        sameSite:process.env.NODE_ENV==='production'?'none':'strict',
      })
      return res.json({success:true,message:'Logged Out'})
    }catch(error){
        return res.json({success:false,message:error.message})
    }
}

//send Verification otp to user's Email
export const sendVerifyOtp =async(req,res)=>{
    try{ 
        //const {userId} = req.body;
        const userId = req.user.id;
        //find user by id from database
        const user= await userModel.findById(userId)
        if(user.isAccountVerified){
            return res.json({success:false,message:'Account is already verified'})
        }
        //generate 6 digit otp
        const otp = String(Math.floor(100000 + Math.random() * 900000))
        //store otp in database for this user
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24*60*60*1000 //otp valid for 24 hours
        await user.save();

        //send otp to user's email
        const mailOption ={
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Account verification Otp',
            //text:`Welcome to mern-authentication .Your OTP is ${otp}.Verify your account using this OTP.`,
            html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
        await transporter.sendMail(mailOption)
        res.json({success:true,message:'Otp sent to your email'})

    }catch(error){
        res.json({success:false,message:error.message})  
    }
}

//verify email using otp
export const verifyEmail = async(req,res)=>{
    
    const {otp} = req.body;
    const userId = req.user.id;
    if(!userId || !otp){
        return res.json({success:false,message:'missing Details'})
    }
    try{
        const user = await userModel.findById(userId)
        if(!user){
            return res.json({success:false,message:'User not found'})
        }
        if(user.verifyOtp === '' || user.verifyOtp !==otp){
           return res.json({success:false,message:'Invalid Otp'})   
        }
        //if otp valid then check for expiry date
        if(user.verifyOtpExpireAt < Date.now() ){
            return res.json({success:false,message:'Otp Expired'})
        }
        //otp is valid and not expired then verify user acoount
        user.isAccountVerified = true;
        user.verifyOtp = ''; //reset otp
        user.verifyOtpExpireAt = 0; //reset otp expiry date

        await user.save();
        return res.json({success:true,message:'Email verified succesfully'})

    }catch(error){
        return res.json({success:false,message:error.message})
    }
}

//check if user is authenticated
export const isAuthenticated = async(req,res)=>{
    try{
       
      return res.json({success:true})
    }catch(error){
      res.json({success:false,message:error.message})
    }
}

//send password reset OTP
export const sendResetOtp = async (req,res)=>{
    const {email} = req.body;
    if(!email){
        return res.json({success:false,message:'Email is required'})
    }
    try{
       
       const user= await userModel.findOne({email})
       if(!user){
        return res.json({success:false,message:"User not found"})
       }

       const otp = String(Math.floor(100000 + Math.random()*900000))
       console.log("Gennerated OTP: ",otp)
       
       user.resetOtp= otp;
       user.resetOtpExpireAt = Date.now() + 15*60*1000
       await user.save()

       const mailOption = {
        from : process.env.SENDER_EMAIL,
        to:user.email,
        subject:'Password Reset OTP',
        //text:`Your otp is ${otp}.Use this otp to proceed with eseting your password.`,
        html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
       }
       await transporter.sendMail(mailOption)
       return res.json({success:true,message:'otp sent to your email'})

    }catch(error){
        res.json({success:false,message:error.message})
    }
}

//Reset User Password
export const resetPassowrd = async(req,res)=>{
    const {email,otp,newPassword} = req.body

    if(!email || !otp || !newPassword){
        return res.json({success:false,message:'Email,otp and new password are required'})
    }
    //  const { email, newPassword } = req.body;

    // if (!email || !newPassword) {
    //     return res.json({ success: false, message: 'Email and new password are required' });
    // }
    try{
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:'user not found'})
        }
        if(user.resetOtp ==="" || user.resetOtp !==otp){
            return res.json({success:false,message:'Invalid otp'})
        }
        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success:false,message:'Otp Expired'})
        }

        const hashedPassword = await bcrypt.hash(newPassword,10)
        user.password = hashedPassword
        user.resetOtp='';
        user.resetOtpExpireAt=0;

        await user.save()
        return res.json({success:true,message:'Password has been reset successfully'})


    }catch(error){
        return res.json({success:false,message:error.message})
    }

}
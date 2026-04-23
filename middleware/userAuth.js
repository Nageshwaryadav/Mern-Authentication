import jwt from 'jsonwebtoken'

const userAuth = async(req,res,next)=>{
    const {token} = req.cookies;//get token from cookies

    if(!token){
        return res.json({success:false,message:'Unauthorized.Login again'})
    }
    //token is available
    try{
        //decode the token
        const tokenDecode = jwt.verify(token,process.env.JWT_SECRET)
        console.log(tokenDecode.id)
        //get userid
        if(tokenDecode.id){
            req.user = { id: tokenDecode.id };
           //req.body.userId = tokenDecode.id  //error here
        }else{
            return res.json({success:false,message:'Unauthorized.Login Again'})
        }
        next();

    }catch(error){
        return res.json({success:false,message:error.message})
    }

}

export default userAuth
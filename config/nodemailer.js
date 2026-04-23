import nodemailer from 'nodemailer'

console.log("SMTP User:", process.env.SMTP_USER);
console.log("Sender Email:", process.env.SENDER_EMAIL);

const transporter = nodemailer.createTransport({
   host:'smtp-relay.brevo.com',
   port:587,
   auth:{
      user:process.env.SMTP_USER,
      pass:process.env.SMTP_PASS,
   }   
})

export default transporter
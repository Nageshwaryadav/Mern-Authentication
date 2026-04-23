import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import cookieParser from 'cookie-parser'

import connectDB from './config/mongodb.js'
import authRouter from './routes/authRoute.js'
import userRouter from './routes/userRoutes.js'


const app=express();
const PORT= 4500;
connectDB();

app.use(express.json())
app.use(cookieParser()) 
app.use(cors(
    {   origin:'http://localhost:5173',
        credentials: true,
}))


app.get('/',function(req,res){
    return res.send('hello world')
})
// All routes defined in usersRouter will be prefixed with '/api/auth'
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)

app.listen(PORT,()=>{
    console.log(`server is listening at port ${PORT}`)
})
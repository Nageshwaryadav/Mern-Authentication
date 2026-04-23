import mongoose from 'mongoose'

const connectDB= async function(){
    try {
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database is connected successfully!');
    } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1); 
  }
}

export default connectDB
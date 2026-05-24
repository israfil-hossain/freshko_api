import mongoose from 'mongoose';


const connectDB = async () => {
    try{
        mongoose.connection.on('connected', () => {
            console.log('Database Connected')
        });
        await mongoose.connect(`${process.env.MONGO_URL}${process.env.DB_NAME}`);
    }
    catch(error){
        console.error(error.message);
    }
}

export default connectDB;
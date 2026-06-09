import mongoose from 'mongoose';

const getMongoUri = () => {
    if (process.env.MONGO_URI) {
        return process.env.MONGO_URI;
    }

    if (process.env.MONGO_URL && process.env.DB_NAME) {
        return `${process.env.MONGO_URL}${process.env.DB_NAME}`;
    }

    return '';
};

const connectDB = async () => {
    try{
        mongoose.connection.on('connected', () => {
            console.log('Database Connected')
        });
        const mongoUri = getMongoUri();

        if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
            throw new Error('Invalid MongoDB connection string. Set MONGO_URI or MONGO_URL + DB_NAME in .env');
        }

        await mongoose.connect(mongoUri);
    }
    catch(error){
        console.error(error.message);
        throw error;
    }
}

export default connectDB;

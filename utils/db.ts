import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

export async function connectToDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {

        const options = {
            bufferCommands: true,
            maxPoolSize: 10,
        }

        cached.promise = mongoose
            .connect(MONGODB_URI, options)
            .then(() => mongoose.connection);
    }
    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (err) {
        cached.promise = null;
        console.error('Failed to connect to MongoDB:', err);
        throw err;
    }
}

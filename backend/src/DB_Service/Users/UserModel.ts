import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Omit<Document, '_id'> {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

const UserSchema = new Schema<IUser>({
  _id: {
    type: String,
    required: true,
    unique: true,
    alias: 'userId',
    minLength: 9,
    maxlength: 9
  },
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "student" }
},
  {
    _id: false,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  });

export const User = mongoose.model<IUser>('User', UserSchema);
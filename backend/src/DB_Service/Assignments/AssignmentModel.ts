import mongoose, { Document, Schema } from 'mongoose';
import { differenceInDays } from 'date-fns';

export interface IAssignment extends Document {
    title: string;
    description: string;
    dueDate: Date;
    createdDate: Date;
    isOpen?: boolean;
}

const assignmentSchema = new Schema<IAssignment>(
    {
        title: { type: String, required: true },
        description: { type: String },
        dueDate: { type: Date, required: true },
        createdDate: {
            type: Date,
            default: Date.now
        }
    },
    {
        toJSON: {
            virtuals: true,
            transform: (_doc: any, ret: any) => {
                delete ret.__v;
                return ret;
            }
        }
    }
)

assignmentSchema.virtual('isOpen').get(function () {
    const difference = differenceInDays(this.dueDate, Date.now());
    if (difference > 0)
        return true;
    return false;
}
);

export const Assignment = mongoose.model<IAssignment>('assignment', assignmentSchema);
import { Assignment , IAssignment } from './assignmentModel';

export class AssignmentService {

    async createAssignment(newAssignment: JSON): Promise<IAssignment> {
        const assignment = new Assignment(newAssignment);
        return await assignment.save();
    }

    async getAssignments(): Promise<IAssignment[] | null> {
        const assignments = await Assignment.find().exec();
        let assignmentsList = [];
        if (!assignments) throw new Error("Could not find assignments!");
        for (let currentAssignment in assignments) {
            if (assignments[currentAssignment].isOpen == true) {
                assignmentsList.push(assignments[currentAssignment]);
            }
        }
        return assignmentsList;
    }

}

export const assignmentService = new AssignmentService();
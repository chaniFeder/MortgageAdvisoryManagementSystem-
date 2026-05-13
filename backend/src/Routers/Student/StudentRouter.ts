import { Router, Request, Response} from 'express';
import { authenticateToken } from '../../Middlware/AuthenticationMid';
import { RequiredParametersInSubmission } from '../../Middlware/RequiredParametersMid';
import { AssignmentService } from '../../DB_Service/Assignments/AssignmentsService';
import { logger } from "../../Utils/Logger";
import { submissionService } from '../../DB_Service/Submission/SubmissionService';

export const router = Router();

router.use(authenticateToken);

const assignmentService = new AssignmentService();

router.get('/assignments', async (req: Request, res: Response) => {
    try {
        const assignments = await assignmentService.getAssignments();

        if (!assignments || assignments.length === 0) {
            res.status(404).json({ error: 'No assignments found.' });
            return;
        }
        res.status(201).json(assignments);
    } catch (error: any) {
        logger.error(`Failed to get assignments: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});


router.post('/submissions', RequiredParametersInSubmission, async (req: Request, res: Response) => {
    const { assignmentId, gitHubLink, partner } = req.body;
    const studentId = (req as any).user.id;
    const newSubmission = { assignmentId, studentId, gitHubLink, partner };
    if (!assignmentId || !gitHubLink) {
        return res.status(400).json({ error: "You must enter all required details (assignmentId, gitHubLink)" });
    }
    try {
        const submission = await submissionService.createSubmission(newSubmission);
        logger.debug("submission was created successfully")
        res.status(201).send(submission);
    }
    catch (error: any) {
        logger.error(`Failed to create submission: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});


router.get('/submissions/me', async (req: Request, res: Response) => {
    try {
        const submissions = await submissionService.getMySubmissions((req as any).user.id);
        if (!submissions || submissions.length === 0) {
            res.status(404).json({ error: 'No submissions found.' });
            return;
        }
        logger.debug("assignment was looked up!");
        res.status(201).json(submissions);
    } catch (error: any) {
        logger.error(`Failed to get my submissions: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});
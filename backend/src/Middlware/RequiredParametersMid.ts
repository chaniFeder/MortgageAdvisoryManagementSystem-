import { Request, Response, NextFunction } from "express";

export function RequiredParametersInUser(req: Request, res: Response, next: NextFunction) {
    const user = req.body;
    if (!user) {
        return res.status(401).json({ error: "No parameters entered!" });
    }
    if (!user.userId) {

        return res.status(400).json({ error: "Missing required parameter: userId" });
    }
    if (!user.name) {
        return res.status(400).json({ error: "Missing required parameter: name" });
    }
    if (!user.password) {
        return res.status(400).json({ error: "Missing required parameter: password" });
    }
    next();
}

export function RequiredParametersInAssignment(req: Request, res: Response, next: NextFunction) {
    const assignment = req.body;
    if (!assignment) {
        return res.status(401).json({ error: "No parameters entered!" });
    }
    if (!assignment.title) {
        return res.status(400).json({ error: "Missing required parameter: title" });
    }
    if (!assignment.dueDate) {
        return res.status(400).json({ error: "Missing required parameter: assignmentDueDate" });
    }
    next();
}

export function RequiredParametersInSubmission(req: Request, res: Response, next: NextFunction) {
    const submission = req.body;
    if (!submission) {
        return res.status(401).json({ error: "No parameters entered!" });
    }
    if (!submission.assignmentId) {
        return res.status(400).json({ error: "Missing required parameter: assignmentId" });
    }
    if (!submission.gitHubLink) {
        return res.status(400).json({ error: "Missing required parameter: gitHubLink" });
    }
    next();
}

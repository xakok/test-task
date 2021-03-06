import { ToInt } from "class-sanitizer";
import { sanitize } from "class-sanitizer/class-sanitizer";
import { plainToClass } from "class-transformer";
import { IsIn, IsPositive } from "class-validator";
import { Request } from "express";
import { getConnection } from "typeorm";
import Task from "../entity/Task";
import HttpError from "../util/http-error";
import validate from "../util/validate";

const PAGE_SIZE = 3;

class QueryParams {
    @IsIn(["id", "username", "email", "status"])
    public sort_field?: string;

    @IsIn(["asc", "desc"])
    public sort_direction?: string;

    @ToInt()
    @IsPositive()
    public page?: number;
}

export default async function getTasks(req: Request) {
    const params: QueryParams = plainToClass(QueryParams, req.query);
    sanitize(params);
    const errors = validate(params, { skipMissingProperties: true });
    if (errors) {
        throw new HttpError(400, errors);
    }
    const [tasks, total_task_count] = await getConnection().getRepository(Task).findAndCount({
        skip: params.page ? (params.page - 1) * PAGE_SIZE : 0,
        take: PAGE_SIZE,
        order: (params.sort_field && { [params.sort_field]: params.sort_direction === "desc" ? -1 : 1 }) as any,
    });
    return { tasks, total_task_count };
}

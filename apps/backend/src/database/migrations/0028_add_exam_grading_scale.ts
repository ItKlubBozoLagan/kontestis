import { ExamGradingScaleV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    exam_grading_scales: ExamGradingScaleV1;
};

export const migration_add_exam_grading_scale: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "exam_grading_scales",
        true,
        {
            id: { type: "bigint" },
            contest_id: { type: "bigint" },
            percentage: { type: "double" },
            grade: { type: "text" },
        },
        "id"
    );
    await database.createIndex(
        "exam_grading_scales",
        "exam_grading_scales_by_contest_id",
        "contest_id"
    );
    log("Done");
};

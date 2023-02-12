import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPermissions } from "@kontestis/models";
import { FC, useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "react-modal";
import { useQueryClient } from "react-query";
import * as R from "remeda";
import { z } from "zod";

import { CanAdmin } from "../../components/CanAdmin";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledDateInput } from "../../components/TitledDateInput";
import { TitledInput } from "../../components/TitledInput";
import { TitledSwitch } from "../../components/TitledSwitch";
import { useCreateContest } from "../../hooks/contest/useCreateContest";
import { ModalStyles } from "../../util/ModalStyles";

const CreateContestSchema = z.object({
    name: z.string().min(1),
    start_time: z.coerce.date(),
    duration_hours: z.coerce.number(),
    duration_minutes: z.coerce.number(),
    public: z.boolean(),
    official: z.boolean(),
});

export const CreateContestModal: FC<Modal.Props> = ({ ...properties }) => {
    const {
        register,
        handleSubmit,
        setValue,
        setError,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof CreateContestSchema>>({
        resolver: zodResolver(CreateContestSchema),
        defaultValues: {
            duration_hours: 3,
            duration_minutes: 0,
            official: false,
            public: false,
        },
    });

    const createMutation = useCreateContest();

    const queryClient = useQueryClient();

    const onSubmit = handleSubmit((data) => {
        createMutation.reset();

        if (data.start_time.getTime() <= Date.now()) {
            setError("start_time", {
                message: "past contest",
            });

            return;
        }

        createMutation.mutate({
            ...R.omit(data, ["duration_hours", "duration_minutes", "start_time"]),
            start_time_millis: data.start_time.getTime(),
            duration_seconds: data.duration_hours * 60 * 60 + data.duration_minutes * 60,
        });
    });

    useEffect(() => {
        if (!createMutation.isSuccess) return;

        queryClient.invalidateQueries(["contests"]);
        createMutation.reset();
        reset();
        properties.onAfterClose?.();
    }, [createMutation.isSuccess]);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create contest Modal"}
            style={ModalStyles}
        >
            <div tw={"text-xl"}>Create contest</div>
            <div tw={"text-sm text-red-500"}>
                {Object.keys(errors).length > 0 && <span>Validation error! Check your input!</span>}
                {createMutation.error && <span>Error! {createMutation.error.message}</span>}
            </div>
            <form onSubmit={onSubmit}>
                <div tw={"flex flex-col items-stretch gap-2"}>
                    <TitledInput bigLabel label={"Name"} tw={"max-w-full"} {...register("name")} />
                    <div tw={"flex gap-4"}>
                        <TitledDateInput
                            type={"datetime"}
                            label={"Start time"}
                            bigLabel
                            {...register("start_time")}
                        />
                        <div tw={"flex items-end gap-2 w-full"}>
                            <TitledInput
                                bigLabel
                                label={"Duration"}
                                tw={"w-24"}
                                {...register("duration_hours")}
                            />
                            <span>h</span>
                            <TitledInput
                                bigLabel
                                tw={"pl-2 flex-shrink w-24"}
                                {...register("duration_minutes")}
                            />
                            <span>m</span>
                        </div>
                    </div>
                    <div tw={"flex gap-4"}>
                        <div tw={"w-full"}>
                            <TitledSwitch
                                label={"Visibility"}
                                choice={["Private", "Public"]}
                                onChange={(value) => setValue("public", value === "Public")}
                            />
                        </div>
                        <CanAdmin permission={AdminPermissions.ADMIN}>
                            <div tw={"w-full"}>
                                <TitledSwitch
                                    label={"Scoring"}
                                    choice={["Unofficial", "Official"]}
                                    onChange={(value) => setValue("official", value === "Official")}
                                />
                            </div>
                        </CanAdmin>
                    </div>
                    <SimpleButton tw={"mt-2"}>Create</SimpleButton>
                </div>
            </form>
        </Modal>
    );
};

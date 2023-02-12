import { AdminPermissions } from "@kontestis/models";
import { FC } from "react";
import Modal from "react-modal";

import { CanAdmin } from "../../components/CanAdmin";
import { SimpleButton } from "../../components/SimpleButton";
import { TitledDateInput } from "../../components/TitledDateInput";
import { TitledInput } from "../../components/TitledInput";
import { TitledSwitch } from "../../components/TitledSwitch";
import { ModalStyles } from "../../util/ModalStyles";

export const CreateContestModal: FC<Modal.Props> = ({ ...properties }) => {
    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create contest Modal"}
            style={ModalStyles}
        >
            <div tw={"flex flex-col items-stretch gap-2"}>
                <TitledInput bigLabel label={"Name"} tw={"max-w-full"} />
                <div tw={"flex gap-4"}>
                    <TitledDateInput type={"datetime"} label={"Start time"} bigLabel />
                    <div tw={"flex items-end gap-2 w-full"}>
                        <TitledInput bigLabel label={"Duration"} tw={"w-24"} />
                        <span>h</span>
                        <TitledInput bigLabel tw={"pl-2 flex-shrink w-24"} />
                        <span>m</span>
                    </div>
                </div>
                <div tw={"flex gap-4"}>
                    <div tw={"w-full"}>
                        <TitledSwitch
                            label={"Visibility"}
                            choice={["Private", "Public"]}
                            onChange={console.log}
                        />
                    </div>
                    <CanAdmin permission={AdminPermissions.ADMIN}>
                        <div tw={"w-full"}>
                            <TitledSwitch
                                label={"Scoring"}
                                choice={["Official", "Unofficial"]}
                                onChange={console.log}
                            />
                        </div>
                    </CanAdmin>
                </div>
                <SimpleButton tw={"mt-2"}>Create</SimpleButton>
            </div>
        </Modal>
    );
};

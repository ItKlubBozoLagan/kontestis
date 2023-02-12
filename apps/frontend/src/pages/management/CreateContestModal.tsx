import { FC } from "react";
import Modal from "react-modal";
import { theme } from "twin.macro";

import { SimpleButton } from "../../components/SimpleButton";
import { TitledInput } from "../../components/TitledInput";

export const CreateContestModal: FC<Modal.Props> = ({ ...properties }) => {
    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            contentLabel={"Create contest Modal"}
            style={{
                content: {
                    top: "10%",
                    left: "50%",
                    right: "auto",
                    bottom: "auto",
                    marginRight: "-50%",
                    transform: "translateX(-50%)",
                    border: `1px solid ${theme`colors.neutral.400`}`,
                    borderRadius: "unset",
                    padding: "1rem",
                    backgroundColor: theme`colors.neutral.100`,
                },
                overlay: {
                    backgroundColor: "#00000022",
                },
            }}
        >
            <TitledInput name={"Name"} />
            <TitledInput name={"Start time"} />
            <TitledInput name={"Duration"} />
            <TitledInput name={"Private"} />
            <TitledInput name={"Official"} />
            <SimpleButton>Create</SimpleButton>
        </Modal>
    );
};

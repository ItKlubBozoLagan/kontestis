import Modal from "react-modal";
import { theme } from "twin.macro";

export const ModalStyles: Modal.Styles = {
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
        backdropFilter: "blur(2px)",
    },
};

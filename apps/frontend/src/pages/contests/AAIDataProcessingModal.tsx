import { FC } from "react";
import Modal from "react-modal";

import { SimpleButton } from "../../components/SimpleButton";
import { useAuthStore } from "../../state/auth";
import { ModalStyles } from "../../util/ModalStyles";

export const AAIDataProcessingModal: FC<Modal.Props> = ({ ...properties }) => {
    // TODO: i8n, this is a temp solution

    const { user } = useAuthStore();

    if (!user.is_edu) return <></>;

    const userDob = user.edu_data?.dob ?? new Date("1/1/2000");

    const minimumDob = new Date();

    minimumDob.setFullYear(minimumDob.getFullYear() - 18);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            style={ModalStyles}
            contentLabel={"Suglasnost"}
        >
            {userDob.getTime() > minimumDob.getTime() ? (
                <div tw={"text-xl p-2"}>
                    Maloljetnim natjecateljima je potrebna{" "}
                    <a
                        href={
                            "https://docs.google.com/document/d/1X8neYV8vG4MyrM56_ExmANihbTVWkhKAy1wnenm4bkc/edit?usp=sharing"
                        }
                        target={"_blank"}
                        tw={"text-blue-700"}
                        rel="noreferrer"
                    >
                        suglasnost
                    </a>{" "}
                    odgovorne osobe, molimo da suglasnost pošaljete{" "}
                    <a
                        href={"https://forms.gle/pk2dLqpY7qZLUbu78"}
                        target={"_blank"}
                        tw={"text-blue-700"}
                        rel="noreferrer"
                    >
                        ovdje
                    </a>
                    .
                    <br />U slučaju da ne priložite suglasnost na vrijeme (najkasnije do završnog
                    online kola) vaši rezultati neće biti na službenim rang listama, te nećete imati
                    pravo sudjelovanja u finalu natjecanja.
                </div>
            ) : (
                <div tw={"text-xl p-2"}>
                    Sudjelovanjem u Natjecanju pristajem na obradu i objavu svojih podataka za
                    provođenje Natjecanja. To uključuje javno proglašenje pobjednika, dodjelu
                    nagrada te objavu materijala vezanih uz promociju Natjecanja.
                </div>
            )}
            <a
                href={"https://nap.xfer.hr"}
                target={"_blank"}
                tw={"text-xl p-2 text-blue-700"}
                rel="noreferrer"
            >
                Stranica natjecanja
            </a>
            <a
                href={
                    "https://docs.google.com/document/d/1tKBnTB1HlAMCwKXFPm1w7yS6f_2hgQzNyf2F1PFs6YI/edit?usp=sharing"
                }
                target={"_blank"}
                tw={"text-xl p-2 text-blue-700"}
                rel="noreferrer"
            >
                Pravilnik natjecanja
            </a>
            <div tw={"p-2"}>
                <SimpleButton onClick={() => properties.onAfterClose?.()}>Uredu</SimpleButton>
            </div>
        </Modal>
    );
};

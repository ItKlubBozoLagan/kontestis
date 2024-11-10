import { FC } from "react";
import Modal from "react-modal";

import { SimpleButton } from "../../components/SimpleButton";
import { useAuthStore } from "../../state/auth";
import { ModalStyles } from "../../util/ModalStyles";

export const AAIDataProcessingModal: FC<Modal.Props> = ({ ...properties }) => {
    // TODO: i8n, this is a temp solution

    const { user } = useAuthStore();

    if (!user.is_edu) return <></>;

    const minimumAge = new Date();

    minimumAge.setFullYear(minimumAge.getFullYear() - 18);

    return (
        <Modal
            {...properties}
            shouldCloseOnEsc
            shouldCloseOnOverlayClick
            style={ModalStyles}
            contentLabel={"Suglasnost"}
        >
            {(user.edu_data?.dob?.getTime() ?? new Date("1/1/2000")) > minimumAge.getTime() ? (
                <div tw={"text-xl p-2"}>
                    Maloljetnim natjecateljima je potrebna{" "}
                    <a
                        href={
                            "https://docs.google.com/document/d/1X8neYV8vG4MyrM56_ExmANihbTVWkhKAy1wnenm4bkc/edit?usp=sharing"
                        }
                        tw={"text-blue-700"}
                    >
                        suglasnost
                    </a>{" "}
                    odgovorne osobe, molimo da suglasnost pošaljete{" "}
                    <a href={"https://forms.gle/pk2dLqpY7qZLUbu78"} tw={"text-blue-700"}>
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
            <a href={"https://nap.xfer.hr"} tw={"text-xl p-2 text-blue-700"}>
                Stranica natjecanja
            </a>
            <a
                href={
                    "https://docs.google.com/document/d/1tKBnTB1HlAMCwKXFPm1w7yS6f_2hgQzNyf2F1PFs6YI/edit?usp=sharing"
                }
                tw={"text-xl p-2 text-blue-700"}
            >
                Pravilnik natjecanja
            </a>
            <div tw={"p-2"}>
                <SimpleButton onClick={() => properties.onAfterClose?.()}>Uredu</SimpleButton>
            </div>
        </Modal>
    );
};

import { FC, useState } from "react";

import { http } from "../../../api/http";
import { SimpleButton } from "../../../components/SimpleButton";
import { TitledInput } from "../../../components/TitledInput";

// TODO: Make this better!
export const AdminMailPage: FC = () => {
    const [subject, setSubject] = useState("");
    const [text, setText] = useState("");

    const [contestAnnouncement, setContestAnnouncement] = useState(false);
    const [debugMode, setDebugMode] = useState(true);

    return (
        <div tw={"w-full flex flex-col gap-8"}>
            <div tw={"w-full flex flex-col gap-2"}>
                <TitledInput
                    type={"checkbox"}
                    label={"Contest announcement"}
                    onChange={(event) => setContestAnnouncement(event.target.checked)}
                    checked={contestAnnouncement}
                />
                <TitledInput
                    type={"checkbox"}
                    label={"Debug mode"}
                    onChange={(event) => setDebugMode(event.target.checked)}
                    checked={debugMode}
                />
                <TitledInput
                    label={"Subject"}
                    onChange={(event) => setSubject(event.target.value)}
                    value={subject}
                />
                <textarea onChange={(event) => setText(event.target.value)} value={text} />

                <SimpleButton
                    onClick={() => {
                        http.post("/notifications/sendMail", {
                            subject: subject,
                            text: text,
                            contestAnnouncement: contestAnnouncement,
                            debugMode: debugMode,
                        });
                        setSubject("");
                        setText("");
                        setContestAnnouncement(false);
                        setDebugMode(true);
                    }}
                >
                    Send mail to all users!
                </SimpleButton>
            </div>
        </div>
    );
};

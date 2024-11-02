import { EduUser, User } from "@kontestis/models";
import { StatusCodes } from "http-status-codes";
import { EMPTY_PERMISSIONS } from "permissio";

import { Database } from "../database/Database";
import { SafeError } from "../errors/SafeError";
import { AaiEduTokenData } from "./aaiedu";
import { generateGravatarUrl, generateJwt, processLogin } from "./auth";
import { generateSnowflake } from "./snowflake";

// baš špageti

const parseEduToken = (info: AaiEduTokenData): Omit<EduUser, keyof User> => ({
    uid: info.hrEduPersonUniqueID[0],
    dob: info.hrEduPersonDateOfBirth
        ? (() => {
              const [dateString] = info.hrEduPersonDateOfBirth;

              const [year, month, day] = [
                  Number.parseInt(dateString.slice(0, 4)),
                  Number.parseInt(dateString.slice(4, 6)) - 1, // Months are 0-based in JS
                  Number.parseInt(dateString.slice(6, 8)),
              ];

              return new Date(year, month, day);
          })()
        : null,
    student_category: info.hrEduPersonStudentCategory?.[0] ?? null,
    associated_org: info.o[0],
    professional_status: info.hrEduPersonProfessionalStatus?.[0] ?? null,
});

export const loginEduUser = async (
    eduUserData: AaiEduTokenData,
    id_token: string
): Promise<{ token: string }> => {
    const existingEduUser = await Database.selectOneFrom("edu_users", "*", {
        uid: eduUserData.hrEduPersonUniqueID[0],
    });

    const existingMailUser = await Database.selectOneFrom("users", "*", {
        email: eduUserData.hrEduPersonUniqueID[0],
    });

    if (existingEduUser) {
        const existingUser = await Database.selectOneFrom("users", "*", {
            id: existingEduUser.id,
        });

        if (!existingUser) throw new SafeError(StatusCodes.CONFLICT);

        if (existingMailUser && existingUser.id !== existingMailUser.id)
            throw new SafeError(StatusCodes.CONFLICT);
    }

    const id = existingEduUser?.id ?? existingMailUser?.id ?? generateSnowflake();
    const permissions =
        existingEduUser?.permissions ?? existingMailUser?.permissions ?? EMPTY_PERMISSIONS;
    const picture_url =
        existingEduUser?.picture_url ||
        existingMailUser?.picture_url ||
        generateGravatarUrl(eduUserData.mail[0]);

    const eduUser: EduUser = {
        id,
        full_name: eduUserData.cn[0],
        email: eduUserData.mail[0],
        permissions,
        picture_url,
        ...parseEduToken(eduUserData),
    };

    await Database.insertInto("edu_users", eduUser);

    if (!existingEduUser && !existingMailUser)
        await Database.insertInto("users", {
            id: eduUser.id,
            full_name: eduUser.full_name,
            email: eduUser.email,
            permissions: eduUser.permissions,
            picture_url: eduUser.picture_url,
        });

    await processLogin(eduUser, !existingEduUser && !existingMailUser);

    const jwt = generateJwt(eduUser.id, "aai-edu", {
        id_token,
    });

    return { token: jwt };
};

export const linkEduUser = async (
    user: User,
    eduUserData: AaiEduTokenData,
    id_token: string
): Promise<{ token: string }> => {
    const existingEduUser = await Database.selectOneFrom("edu_users", "*", {
        uid: eduUserData.hrEduPersonUniqueID[0],
    });

    if (existingEduUser && user.id !== existingEduUser.id)
        throw new SafeError(StatusCodes.CONFLICT);

    if (existingEduUser) {
        await Database.update(
            "edu_users",
            {
                full_name: eduUserData.cn[0],
                email: eduUserData.mail[0],
                ...parseEduToken(eduUserData),
            },
            {
                id: existingEduUser.id,
            }
        );

        const jwt = generateJwt(user.id, "aai-edu", {
            id_token,
        });

        return { token: jwt };
    }

    await Database.insertInto("edu_users", {
        id: user.id,
        full_name: eduUserData.cn[0],
        email: eduUserData.mail[0],
        permissions: user.permissions,
        picture_url: user.picture_url,
        ...parseEduToken(eduUserData),
    });

    const jwt = generateJwt(user.id, "aai-edu", {
        id_token,
    });

    return { token: jwt };
};

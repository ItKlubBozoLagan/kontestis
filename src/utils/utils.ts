import { DataBase } from "../data/Database";
import { Snowflake } from "../lib/snowflake";
import { User } from "../types/User";

export const isValidCallendar = async (user: User, calendar_id: Snowflake) => {

    if(user.permissions & 1) return true;
    
    const userCalendarEntry = await DataBase.selectOneFrom("user_calendar_entry", "*", { user_id: user.user_id, calendar_id: calendar_id });

    return userCalendarEntry != null;
};
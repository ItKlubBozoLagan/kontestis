type ParseResult =
    | {
          success: false;
          data: undefined;
      }
    | {
          success: true;
          data: any;
      };

export const safeParseJson = (data: any): ParseResult => {
    let parsed;

    try {
        parsed = JSON.parse(data);
    } catch {
        return {
            success: false,
            data: undefined,
        };
    }

    return {
        success: true,
        data: parsed,
    };
};

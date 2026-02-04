import axios from "axios";

export const downloadFile = async (path: string) => {
    try {
        const response = await axios.get(path, {
            responseType: "blob",
        });

        // Extract file name from headers if available
        const contentDisposition = response.headers["content-disposition"];
        let filename = "downloaded-file";

        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);

            if (match && match[1]) filename = match[1];
        }

        // Create a Blob from the response data
        const blob = new Blob([response.data], { type: response.headers["content-type"] });
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link and trigger the download
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", filename);
        document.body.append(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("File download failed:", error);
    }
};

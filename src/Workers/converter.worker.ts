import { createFFmpeg } from "@ffmpeg/ffmpeg";

export interface ConverterWorkerResult {
    type: "result";
    data: ArrayBuffer;
}

export interface ConverterWorkerError {
    type: "error";
    error: Error;
}

export interface ConverterWorkerProgress {
    type: "progress";
    progress: number;
}

declare function postMessage(message: any, transfer?: Transferable[]): void;
declare function postMessage<T>(message: T, transfer?: Transferable[]): void;

const ffmpeg = createFFmpeg({
    log: true,
    progress: ({ratio}) => postMessage<ConverterWorkerProgress>({type: "progress", progress: ratio})
});

export interface Data {
    data: ArrayBuffer;
    inType: string;
    outType: string;
    name: string;
}

onmessage = async (event: MessageEvent<Data>) => {
    try {
        const {data, inType, outType, name} = event.data;

        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        ffmpeg.FS('writeFile', `${name}.${inType}`, new Uint8Array(data));
        await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
        const result = ffmpeg.FS('readFile', `${name}.${outType}`);

        postMessage<ConverterWorkerResult>({data: result.buffer, type: "result"}, [result.buffer]);
    } catch (e) {
        postMessage<ConverterWorkerError>({type: "error", error: e as Error});
    }
}
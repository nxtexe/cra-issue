export function getVideo(url: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => resolve(buffer))
        .catch((e) => reject(e));
    });
}
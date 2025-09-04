import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    "https://tfshrbdopckpcjerjjrb.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc2hyYmRvcGNrcGNqZXJqanJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMTEzMDUsImV4cCI6MjA2ODU4NzMwNX0._LXIpFBm19okm9o_9Es4tBHRKsiDSWpoPtptCn2ajMw"
)

export default function meadiaUpload(file){
    const promise = new Promise(
        (resolve, reject)=>{
            if(file == null){
                reject("No file selected")
            }
            const timeStamp = new Date().getTime()
            const newFileName = timeStamp+file.name

            supabase.storage.from("images").upload(newFileName, file, {
                cacheControl: "3600",
                upsert: false,
            }).then(
                ()=>{
                    const url = supabase.storage.from("images").getPublicUrl(newFileName).data.publicUrl
                    resolve(url)
                }
            ).catch(
                (err)=>{
                    console.log(err)
                    reject("File upload failed")
                }
            )
        }
    )

    return promise;
}
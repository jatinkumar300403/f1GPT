import "./global.css"
export const metadata = {
    title: "F1GPT",
    description: "Ask anything about Formula One, vroom vroommmm!!"
}

const RootLayout = ({children})=>{
    return (
        <html lang="en">
        <body>
        {children}
        </body>
        </html>
    )
}

export default RootLayout;
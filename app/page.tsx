"use client"
import Image from "next/image"
import f1gptlogo from "./assets/f1_logo.png"
import { useChat } from 'ai/react';
import { Message } from "ai"
import Bubble from "./component/Bubble"
import LoadingBubble from "./component/LoadingBubble"
import PromptSuggestionsRow from "./component/PromptSuggestionsRow"


const Home = () =>{
    const { input, append, isLoading, messages, handleInputChange, handleSubmit } = useChat()

    const noMessages = !messages || messages.length===0;

    const handlePrompt = (promptText) => {
        const msg:Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }

    return (
        <main>
            <Image src={f1gptlogo} width="250" alt="F!GPT Logo"/>
            <section className={noMessages?"" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The ultimate place for Formula One super fans!
                            Hope you enjoy!
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>
                    ) : (
                    <>
                        {messages.map((message,index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
                        {/*{Bubble}*/}
                    </>
                )}

            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something.."/>

                <input type="submit"/>
            </form>
        </main>
    )
}

export default Home
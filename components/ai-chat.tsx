"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

export function AIChat() {
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    []
  );
  const [inputMessage, setInputMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() === "") return;

    // Add user message
    const newMessages = [...messages, { text: inputMessage, isUser: true }];
    setMessages(newMessages);
    setInputMessage("");

    // Simulate AI response with more friendly tone
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "I'm currently offline. For immediate assistance, please use our other support channels🥹.",
          isUser: false,
        },
      ]);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto shadow-lg">
      <CardHeader className="border-b p-4">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-blue-500" />
          <div>
            <CardTitle className="text-xl font-bold">
              Proton Medicare Support
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Instant assistance, anytime
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-[300px] sm:h-[400px] md:h-[400px] p-2 border rounded-md overflow-y-auto"
        >
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Start a conversation by sending a message
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex items-center space-x-2 max-w-[80%] ${
                    message.isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {message.isUser ? (
                    <User className="w-6 h-6 text-primary" />
                  ) : (
                    <Bot className="w-6 h-6 text-blue-500" />
                  )}
                  <div
                    className={`p-3 rounded-xl ${
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} size="icon" className="w-8 h-8">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Please do not share sensitive personal information
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

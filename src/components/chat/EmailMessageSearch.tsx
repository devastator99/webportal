
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessagesList } from "./ChatMessagesList";
import { Search } from "lucide-react";

export const EmailMessageSearch = () => {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState<string | null>(null);

  const handleSearch = () => {
    if (email.trim()) {
      setSearchEmail(email.trim());
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Search Messages by Email</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Enter email (e.g., prakash@test.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <Button onClick={handleSearch} size="sm" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
        </div>
      </CardContent>
      
      <div className="flex-1 overflow-hidden">
        {searchEmail ? (
          <ChatMessagesList specificEmail={searchEmail} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Enter an email address to search for messages
          </div>
        )}
      </div>
    </Card>
  );
};

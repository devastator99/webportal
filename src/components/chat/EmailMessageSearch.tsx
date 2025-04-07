
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatMessagesList } from "./ChatMessagesList";
import { Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const EmailMessageSearch = () => {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = () => {
    if (email.trim()) {
      setSearchEmail(email.trim());
      toast({
        title: "Searching messages",
        description: `Looking for messages from ${email.trim()}`,
      });
    } else {
      toast({
        title: "Email required",
        description: "Please enter an email to search for messages",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Search Messages by Email
        </CardTitle>
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

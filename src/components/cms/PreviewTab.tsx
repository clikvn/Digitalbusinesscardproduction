import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { BusinessCardData } from "../../types/business-card";
import { Button } from "../ui/button";
import { ExternalLink } from "lucide-react";

interface PreviewTabProps {
  data: BusinessCardData;
}

export function PreviewTab({ data }: PreviewTabProps) {
  const handleOpenPreview = () => {
    window.open("/", "_blank");
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview Your Card</CardTitle>
            <CardDescription>See how your business card looks to others</CardDescription>
          </div>
          <Button onClick={handleOpenPreview}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full Preview
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#e9e6dc]/30 p-6 rounded-lg border border-[#535146]/10">
          <h3 className="font-semibold text-[#535146] mb-4">Data Summary</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-[#535146]/70 mb-2">Personal Info</h4>
              <div className="bg-white p-3 rounded text-sm space-y-1">
                <p><strong>Name:</strong> {data.personal.name || "Not set"}</p>
                <p><strong>Title:</strong> {data.personal.title || "Not set"}</p>
                <p><strong>Bio:</strong> {data.personal.bio ? `${data.personal.bio.substring(0, 100)}${data.personal.bio.length > 100 ? '...' : ''}` : "Not set"}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#535146]/70 mb-2">Contact</h4>
              <div className="bg-white p-3 rounded text-sm space-y-1">
                <p><strong>Phone:</strong> {data.contact.phone || "Not set"}</p>
                <p><strong>Email:</strong> {data.contact.email || "Not set"}</p>
                <p><strong>Address:</strong> {data.contact.address || "Not set"}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#535146]/70 mb-2">Social Links</h4>
              <div className="bg-white p-3 rounded text-sm">
                <p><strong>Messaging Apps:</strong> {Object.values(data.socialMessaging).filter(app => app).length} configured</p>
                <p><strong>Social Channels:</strong> {Object.values(data.socialChannels).filter(channel => channel).length} configured</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#535146]/70 mb-2">Portfolio</h4>
              <div className="bg-white p-3 rounded text-sm">
                <p><strong>Items:</strong> {data.portfolio.length} project{data.portfolio.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[#535146]/70 mb-2">Profile</h4>
              <div className="bg-white p-3 rounded text-sm space-y-1">
                <p><strong>About:</strong> {data.profile.about ? `${data.profile.about.substring(0, 50)}${data.profile.about.length > 50 ? '...' : ''}` : "Not set"}</p>
                <p><strong>Service Areas:</strong> {data.profile.serviceAreas || "Not set"}</p>
                <p><strong>Specialties:</strong> {data.profile.specialties || "Not set"}</p>
                <p><strong>Experience:</strong> {data.profile.experience ? `${data.profile.experience.substring(0, 50)}${data.profile.experience.length > 50 ? '...' : ''}` : "Not set"}</p>
                <p><strong>Languages:</strong> {data.profile.languages || "Not set"}</p>
                <p><strong>Certifications:</strong> {data.profile.certifications || "Not set"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Your changes are automatically saved. Click "Open Full Preview" to see your card as others will see it, or use the "View Card" button in the header to navigate to the live card.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

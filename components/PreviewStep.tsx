interface PreviewStepProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    maritalStatus: string;
    gender: string;
    plan: string;
    duration: string;
    referral: string;
  };
  previewImage: string | null;
}

export function PreviewStep({ formData, previewImage }: PreviewStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review Your Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p>
            <strong>Name:</strong> {formData.firstName} {formData.lastName}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          <p>
            <strong>Phone:</strong> {formData.phone}
          </p>
          <p>
            <strong>Date of Birth:</strong> {formData.dob}
          </p>
          <p>
            <strong>Marital Status:</strong> {formData.maritalStatus}
          </p>
          <p>
            <strong>Gender:</strong> {formData.gender}
          </p>
          <p>
            <strong>Plan:</strong> {formData.plan}
          </p>
          <p>
            <strong>Payment Duration:</strong> {formData.duration}
          </p>
          <p>
            <strong>Referral Code:</strong> {formData.referral || "N/A"}
          </p>
        </div>
        <div>
          {previewImage && (
            <img
              src={previewImage || "/placeholder.svg"}
              alt="Headshot Preview"
              className="h-auto max-w-full rounded-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}

import { Tailwind, Section, Text, Button, Link } from "@react-email/components";

export type ForgetPasswordEmailProps = {
  url: string;
  username?: string;
};

export default function ForgetPasswordEmail({
  url,
  username,
}: ForgetPasswordEmailProps) {
  return (
    <Tailwind>
      <Section className="flex justify-center items-center w-full min-h-screen font-sans">
        <Section className="flex flex-col items-center w-96 rounded-2xl px-6 py-2 bg-gray-50">
          <Text className="text-xl font-bold text-gray-900 my-2">
            Reset your password
          </Text>
          <Text className="text-gray-500 mb-4">Hi {username},</Text>
          <Text className="text-gray-500 my-0 mb-2">
            Someone (hopefully you) has requested a link to change your
            password. You can do this through the link below.
          </Text>
          <Button
            href={url}
            className="no-underline py-2 bg-neutral-600 rounded text-white font-semibold w-full text-center my-4"
            target="_blank"
            rel="noreferrer"
          >
            Reset password
          </Button>
          <Text className="text-gray-500 my-0 mb-2 text-sm">
            If you did not request this, please ignore this email.
          </Text>
          <Text className="text-gray-400/50 my-0 mb-2 text-xs text-center">
            Your password will not change until you access the link above and
            create a new one.
          </Text>
        </Section>
      </Section>
    </Tailwind>
  );
}

ForgetPasswordEmail.PreviewProps = {
  url: "https://my-better-t-app.com/reset-password?token=abc123",
  username: "John",
};

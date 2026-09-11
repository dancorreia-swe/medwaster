import { Image, Page, Text, View } from "@react-pdf/renderer";
import type { CertificateTheme } from "../../design/catalog";
import { SANS, SERIF } from "../fonts";
import {
  Avatar,
  breakLongText,
  Caption,
  fitFontSize,
  keepWordsWhole,
  type CertificateLayoutProps,
} from "../shared";

const SIGNATURE_WIDTH = 190;

// Numbers use the sans: the serif's old-style figures read poorly in dates
// and codes ("10" looks like "ıo").
function SignatureLine({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: CertificateTheme;
}) {
  return (
    <View style={{ width: SIGNATURE_WIDTH, alignItems: "center" }}>
      <Text style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: 0.3 }}>
        {value}
      </Text>
      <View
        style={{
          width: "100%",
          height: 0.75,
          backgroundColor: theme.ink,
          opacity: 0.55,
          marginTop: 6,
        }}
      />
      <Caption theme={theme} style={{ marginTop: 6 }}>
        {label}
      </Caption>
    </View>
  );
}

/** Formal, centered, diploma-like, with a thin double border. */
export function ClassicoLayout({ content, theme }: CertificateLayoutProps) {
  const nameSize = fitFontSize(content.userName, {
    max: 50,
    min: 10,
    width: 620,
    emPerChar: 0.46,
  });

  return (
    <Page
      size="A4"
      orientation="landscape"
      style={{
        backgroundColor: theme.tint,
        fontFamily: SANS,
        color: theme.ink,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          bottom: 20,
          border: `1.5 solid ${theme.accent}`,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 26,
          left: 26,
          right: 26,
          bottom: 26,
          border: `0.5 solid ${theme.accent}`,
        }}
      />

      <View
        style={{
          flexGrow: 1,
          paddingTop: 50,
          paddingBottom: 44,
          paddingHorizontal: 84,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 3.2,
              textTransform: "uppercase",
            }}
          >
            {content.brand}
          </Text>
          <View
            style={{
              width: 36,
              height: 0.75,
              backgroundColor: theme.accent,
              marginTop: 9,
            }}
          />
        </View>

        <View style={{ alignItems: "center", width: "100%" }}>
          <Caption theme={theme} style={{ fontSize: 8.5, letterSpacing: 2.6 }}>
            Certificado de
          </Caption>
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: fitFontSize(content.title, { max: 34, min: 15, width: 620, emPerChar: 0.5 }),
              lineHeight: 1.15,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            {breakLongText(content.title)}
          </Text>

          {content.photo && (
            <View style={{ marginTop: 18 }}>
              <Avatar
                photo={content.photo}
                size={52}
                theme={theme}
                fill={theme.paper}
                ring={theme.accent}
                initialsFont={SERIF}
              />
            </View>
          )}

          <Text
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 15,
              color: theme.muted,
              marginTop: content.photo ? 8 : 12,
            }}
          >
            Certificamos que
          </Text>
          <Text
            hyphenationCallback={keepWordsWhole}
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: nameSize,
              lineHeight: 1.15,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {breakLongText(content.userName)}
          </Text>
          <View
            style={{
              width: 240,
              height: 0.75,
              backgroundColor: theme.accent,
              marginTop: 12,
            }}
          />
          <Text
            style={{
              fontSize: 11.5,
              lineHeight: 1.5,
              color: theme.muted,
              marginTop: 12,
              maxWidth: 440,
              textAlign: "center",
            }}
          >
            {content.achievement}
          </Text>

          {content.stats.length > 0 && (
            <View style={{ flexDirection: "row", marginTop: 20 }}>
              {content.stats.map((stat, index) => (
                <View
                  key={stat.key}
                  style={{
                    alignItems: "center",
                    paddingHorizontal: 24,
                    ...(index > 0
                      ? { borderLeft: `0.75 solid ${theme.hairline}` }
                      : {}),
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 600 }}>
                    {stat.value}
                  </Text>
                  <Caption theme={theme} style={{ marginTop: 3 }}>
                    {stat.label}
                  </Caption>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ alignItems: "center", width: "100%" }}>
          <View style={{ flexDirection: "row" }}>
            <SignatureLine
              label="Data de conclusão"
              value={content.completionDate}
              theme={theme}
            />
            <View style={{ width: 96 }} />
            <SignatureLine
              label="Código de verificação"
              value={content.verificationCode}
              theme={theme}
            />
          </View>
          {content.slogan && (
            <Text style={{ fontSize: 8, color: theme.muted, marginTop: 16 }}>
              {content.slogan}
            </Text>
          )}
          {content.verification && (
            <Text
              style={{
                fontSize: 7,
                color: theme.muted,
                marginTop: content.slogan ? 4 : 16,
              }}
            >
              Verifique em {content.verification.displayUrl}
            </Text>
          )}
        </View>
      </View>

      {content.verification && (
        <Image
          src={content.verification.qrCode}
          style={{
            position: "absolute",
            right: 46,
            bottom: 46,
            width: 58,
            height: 58,
          }}
        />
      )}
    </Page>
  );
}

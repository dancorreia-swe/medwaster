import { Image, Page, Text, View } from "@react-pdf/renderer";
import { SANS } from "../fonts";
import {
  Avatar,
  Caption,
  fitFontSize,
  keepWordsWhole,
  type CertificateLayoutProps,
} from "../shared";

/** Left-aligned, lots of white space, one accent bar, large sans name. */
export function MinimalistaLayout({ content, theme }: CertificateLayoutProps) {
  const nameSize = fitFontSize(content.userName, {
    max: 54,
    min: 28,
    width: 660,
    emPerChar: 0.5,
  });

  return (
    <Page
      size="A4"
      orientation="landscape"
      style={{
        backgroundColor: theme.paper,
        fontFamily: SANS,
        color: theme.ink,
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 14,
          backgroundColor: theme.accent,
        }}
      />

      <View
        style={{
          flexGrow: 1,
          paddingLeft: 92,
          paddingRight: 72,
          paddingTop: 54,
          paddingBottom: 48,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: 600 }}>{content.brand}</Text>
          <Caption theme={theme} style={{ letterSpacing: 2 }}>
            Certificado
          </Caption>
        </View>

        <View>
          {content.photo && (
            <View style={{ marginBottom: 24 }}>
              <Avatar
                photo={content.photo}
                size={60}
                theme={theme}
                fill={theme.tint}
                ring={theme.tint}
                initialsFont={SANS}
              />
            </View>
          )}
          <Text style={{ fontSize: 14, fontWeight: 500, color: theme.muted }}>
            {content.title}
          </Text>
          <Text
            hyphenationCallback={keepWordsWhole}
            style={{
              fontSize: nameSize,
              fontWeight: 600,
              letterSpacing: -nameSize * 0.025,
              lineHeight: 1.08,
              marginTop: 10,
              maxWidth: 680,
            }}
          >
            {content.userName}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: theme.muted,
              marginTop: 14,
              maxWidth: 460,
            }}
          >
            {content.achievement}
          </Text>

          {content.stats.length > 0 && (
            <View style={{ flexDirection: "row", marginTop: 34 }}>
              {content.stats.map((stat, index) => (
                <View key={stat.key} style={{ marginLeft: index > 0 ? 52 : 0 }}>
                  <Caption theme={theme}>{stat.label}</Caption>
                  <Text style={{ fontSize: 18, fontWeight: 600, marginTop: 5 }}>
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <View style={{ flexDirection: "row" }}>
              <View>
                <Caption theme={theme}>Data de conclusão</Caption>
                <Text style={{ fontSize: 11, fontWeight: 500, marginTop: 5 }}>
                  {content.completionDate}
                </Text>
              </View>
              <View style={{ marginLeft: 52 }}>
                <Caption theme={theme}>Código de verificação</Caption>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: 0.4,
                    marginTop: 5,
                  }}
                >
                  {content.verificationCode}
                </Text>
              </View>
            </View>
            {(content.verification || content.slogan) && (
              <View style={{ marginTop: 18 }}>
                {content.verification && (
                  <Text style={{ fontSize: 7.5, color: theme.muted }}>
                    Verifique em {content.verification.displayUrl}
                  </Text>
                )}
                {content.slogan && (
                  <Text
                    style={{
                      fontSize: 7.5,
                      color: theme.muted,
                      marginTop: content.verification ? 3 : 0,
                    }}
                  >
                    {content.slogan}
                  </Text>
                )}
              </View>
            )}
          </View>

          {content.verification && (
            <Image
              src={content.verification.qrCode}
              style={{ width: 62, height: 62 }}
            />
          )}
        </View>
      </View>
    </Page>
  );
}

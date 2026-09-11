import { Image, Page, Text, View } from "@react-pdf/renderer";
import { SANS, SERIF } from "../fonts";
import {
  Avatar,
  breakLongText,
  Caption,
  fitFontSize,
  keepWordsWhole,
  type CertificateLayoutProps,
} from "../shared";

const PAGE_WIDTH = 841.89;
const PAGE_PADDING = 28;
const BODY_PADDING_X = 54;
const PHOTO_SIZE = 92;
const PHOTO_GAP = 28;

/** Card on a tinted page: photo beside the name, stats row, QR at the bottom. */
export function ModernoLayout({ content, theme }: CertificateLayoutProps) {
  const bodyWidth = PAGE_WIDTH - PAGE_PADDING * 2 - BODY_PADDING_X * 2;
  const nameWidth = bodyWidth - (content.photo ? PHOTO_SIZE + PHOTO_GAP : 0);
  const nameSize = fitFontSize(content.userName, {
    max: 46,
    min: 10,
    width: nameWidth,
    emPerChar: 0.46,
  });

  return (
    <Page
      size="A4"
      orientation="landscape"
      style={{
        backgroundColor: theme.tint,
        padding: PAGE_PADDING,
        fontFamily: SANS,
        color: theme.ink,
      }}
    >
      <View
        style={{
          flexGrow: 1,
          backgroundColor: theme.paper,
          borderRadius: 12,
          border: `0.75 solid ${theme.hairline}`,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", height: 6 }}>
          <View style={{ flexGrow: 1, backgroundColor: theme.accent }} />
          {theme.detail !== theme.accent && (
            <View style={{ width: 120, backgroundColor: theme.detail }} />
          )}
        </View>

        <View
          style={{
            flexGrow: 1,
            paddingHorizontal: BODY_PADDING_X,
            paddingTop: 32,
            paddingBottom: 30,
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
            <Text style={{ fontSize: 11, fontWeight: 600 }}>
              {content.brand}
            </Text>
            <Caption theme={theme} style={{ letterSpacing: 2 }}>
              Certificado
            </Caption>
          </View>

          <View>
            <Text
              hyphenationCallback={keepWordsWhole}
              style={{
                fontFamily: SERIF,
                fontWeight: 600,
                fontSize: fitFontSize(content.title, { max: 30, min: 8, width: bodyWidth, emPerChar: 0.5 }),
                lineHeight: 1.1,
              }}
            >
              {breakLongText(content.title)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 16,
              }}
            >
              {content.photo && (
                <View style={{ marginRight: PHOTO_GAP }}>
                  <Avatar
                    photo={content.photo}
                    size={PHOTO_SIZE}
                    theme={theme}
                    fill={theme.tint}
                    ring={theme.detail}
                    initialsFont={SERIF}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  hyphenationCallback={keepWordsWhole}
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 600,
                    fontSize: nameSize,
                    lineHeight: 1.1,
                  }}
                >
                  {breakLongText(content.userName)}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: theme.muted,
                    marginTop: 8,
                  }}
                >
                  {content.achievement}
                </Text>
              </View>
            </View>

            {content.stats.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: `0.75 solid ${theme.hairline}`,
                }}
              >
                {content.stats.map((stat, index) => (
                  <View
                    key={stat.key}
                    style={{
                      flex: 1,
                      ...(index > 0
                        ? {
                            paddingLeft: 22,
                            borderLeft: `0.75 solid ${theme.hairline}`,
                          }
                        : {}),
                    }}
                  >
                    <Caption theme={theme}>{stat.label}</Caption>
                    <Text style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>
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
                  <Text style={{ fontSize: 12, fontWeight: 500, marginTop: 5 }}>
                    {content.completionDate}
                  </Text>
                </View>
                <View style={{ marginLeft: 48 }}>
                  <Caption theme={theme}>Código de verificação</Caption>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: 0.4,
                      marginTop: 5,
                    }}
                  >
                    {content.verificationCode}
                  </Text>
                </View>
              </View>
              {content.slogan && (
                <Text
                  style={{ fontSize: 8.5, color: theme.muted, marginTop: 18 }}
                >
                  {content.slogan}
                </Text>
              )}
            </View>

            {content.verification && (
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <View
                  style={{ alignItems: "flex-end", marginRight: 14, width: 240 }}
                >
                  <Caption theme={theme}>Verifique a autenticidade</Caption>
                  <Text
                    style={{
                      fontSize: 7,
                      color: theme.muted,
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
                    {content.verification.displayUrl}
                  </Text>
                </View>
                <Image
                  src={content.verification.qrCode}
                  style={{ width: 66, height: 66 }}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </Page>
  );
}

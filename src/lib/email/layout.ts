const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://viveloja.com'

const COLORS = {
  black: '#000000',
  white: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray900: '#171717',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
}

interface EmailLayoutProps {
  title: string
  previewText: string
  content: string
  ctaText?: string
  ctaUrl?: string
  ctaColor?: string
}

export function emailLayout({ title, previewText, content, ctaText, ctaUrl, ctaColor = COLORS.black }: EmailLayoutProps): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.gray50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${COLORS.gray50};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">

          <!-- Logo placeholder -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <!-- ESPACIO PARA LOGO: Reemplazar por <img> cuando tengas logo -->
              <div style="font-size:20px;font-weight:700;letter-spacing:-0.5px;color:${COLORS.gray900};">
                Vive Loja
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${COLORS.white};border-radius:12px;padding:32px;border:1px solid ${COLORS.gray200};">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:${COLORS.gray900};line-height:1.3;">
                ${title}
              </h1>
              <div style="font-size:15px;line-height:1.6;color:${COLORS.gray600};">
                ${content}
              </div>
              ${ctaText && ctaUrl ? `
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:8px;background:${ctaColor};">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:${COLORS.white};text-decoration:none;letter-spacing:0.2px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0;font-size:13px;color:${COLORS.gray400};line-height:1.5;">
              <a href="${BASE_URL}" style="color:${COLORS.gray500};text-decoration:underline;">viveloja.com</a>
              <span style="margin:0 8px;color:${COLORS.gray200};">·</span>
              <a href="${BASE_URL}/dashboard/configuracion" style="color:${COLORS.gray400};text-decoration:underline;">Preferencias de email</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

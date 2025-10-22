import { NextRequest, NextResponse } from 'next/server';
import { UsernameResolver } from '@/lib/farcaster/username-resolver';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Username'i FID'ye çevir
    const userInfo = await UsernameResolver.getUserByUsername(username);
    
    if (!userInfo) {
      return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>User Not Found</title>
</head>
<body>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
    <div style="text-align: center;">
      <h1>❌ Kullanıcı Bulunamadı</h1>
      <p>@${username} kullanıcısı bulunamadı</p>
      <p>Doğru kullanıcı adını kontrol edin</p>
    </div>
  </div>
</body>
</html>`, {
        headers: { 'Content-Type': 'text/html' },
        status: 404,
      });
    }
    
    // FID'ye yönlendir
    const baseUrl = new URL(request.url).origin;
    const redirectUrl = `${baseUrl}/api/frames/tip/${userInfo.fid}`;
    
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Username frame route error:', error);
    
    return new NextResponse(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Error</title>
</head>
<body>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
    <div style="text-align: center;">
      <h1>⚠️ Hata</h1>
      <p>Kullanıcı bilgisi alınırken hata oluştu</p>
    </div>
  </div>
</body>
</html>`, {
      headers: { 'Content-Type': 'text/html' },
      status: 500,
    });
  }
}
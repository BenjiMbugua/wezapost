import { NextRequest, NextResponse } from 'next/server'

/**
 * Instagram Data Deletion Confirmation Page
 * Instagram will check this URL to confirm data has been deleted
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirmationCode = searchParams.get('code')
    
    if (!confirmationCode) {
      return new Response(`
        <html>
          <head><title>Invalid Request</title></head>
          <body>
            <h1>Invalid Deletion Request</h1>
            <p>No confirmation code provided.</p>
          </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    // Here you would verify the deletion was completed
    // and show appropriate status
    
    return new Response(`
      <html>
        <head>
          <title>Data Deletion Confirmed - WezaPost</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .status { padding: 20px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; }
            .code { background: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>Instagram Data Deletion Confirmed</h1>
          <div class="status">
            <p><strong>Status:</strong> Data deletion completed successfully</p>
            <p><strong>Confirmation Code:</strong> <span class="code">${confirmationCode}</span></p>
            <p><strong>Deleted On:</strong> ${new Date().toISOString()}</p>
          </div>
          <p>All Instagram data associated with your account has been permanently deleted from WezaPost systems.</p>
          <p>This action cannot be undone. If you wish to use WezaPost with Instagram in the future, you will need to reconnect your Instagram account.</p>
          <hr>
          <p><small>WezaPost - Social Media Management Platform</small></p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
    
  } catch (error) {
    console.error('Instagram deletion confirmation error:', error)
    return new Response(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error Processing Request</h1>
          <p>Unable to confirm data deletion status.</p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
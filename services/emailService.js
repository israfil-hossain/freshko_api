import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

export async function sendEmail({ to, subject, html }) {
    try {
        await transporter.sendMail({
            from: `"GreenCart" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.log('Email send failed:', error.message);
        return false;
    }
}

export function orderConfirmationHTML(order, userName) {
    const orderId = order._id.toString();
    const itemsRows = order.items.map(item => `
        <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #333;">${item.product?.name || 'Product'}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #666; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #009a49; text-align: right; font-weight: 600;">$${item.product?.offerPrice || 0}</td>
        </tr>
    `).join('');

    const addr = order.address;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:#009a49;padding:24px 32px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Gree<span style="color:#fff;font-weight:300;">n</span>Cart</h1>
<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Order Confirmation</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 32px 24px;">
<p style="margin:0 0 16px;color:#333;font-size:15px;">Dear <strong>${userName || 'Valued Customer'}</strong>,</p>
<p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
Thank you for your order! Your groceries are being prepared and will be on their way soon.
</p>

<!-- Order ID -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
<tr><td style="font-size:13px;color:#666;">Order ID</td></tr>
<tr><td style="font-size:14px;color:#333;font-weight:600;font-family:monospace;">#${orderId.slice(-8).toUpperCase()}</td></tr>
</table>

<!-- Items Table -->
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr style="background:#f0faf4;">
<th style="padding:10px 12px;text-align:left;font-size:13px;color:#333;font-weight:600;">Item</th>
<th style="padding:10px 12px;text-align:center;font-size:13px;color:#333;font-weight:600;">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:13px;color:#333;font-weight:600;">Price</th>
</tr>
${itemsRows}
</table>

<!-- Total -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
<tr>
<td style="font-size:15px;color:#333;font-weight:600;">Total</td>
<td style="text-align:right;font-size:18px;color:#009a49;font-weight:700;">$${order.amount}</td>
</tr>
</table>

<!-- Divider -->
<div style="height:1px;background:#eee;margin:20px 0;"></div>

<!-- Delivery Address -->
<p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Delivery Address</p>
<p style="margin:0;font-size:14px;color:#333;line-height:1.5;">
${addr ? `${addr.firstName || ''} ${addr.lastName || ''}<br>${addr.houseNumber ? 'House ' + addr.houseNumber + ', ' : ''}${addr.roadNumber ? 'Road ' + addr.roadNumber + ', ' : ''}${addr.floorNumber ? 'Floor ' + addr.floorNumber : ''}<br>${addr.city || ''}${addr.state ? ', ' + addr.state : ''}${addr.zipcode ? ' - ' + addr.zipcode : ''}` : 'Address on file'}
</p>

<!-- Track Button -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
<tr><td align="center">
<a href="${CLIENT_URL}/my-orders/${orderId}/tracking" style="display:inline-block;background:#009a49;color:#fff;padding:12px 32px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">Track Order</a>
</td></tr>
</table>

<p style="margin:24px 0 0;color:#888;font-size:13px;text-align:center;line-height:1.5;">
Need help? Contact us at <a href="mailto:support@greencart.com" style="color:#009a49;text-decoration:none;">support@greencart.com</a>
</p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;">
<p style="margin:0 0 4px;font-size:12px;color:#aaa;">GreenCart — Fresh groceries delivered to your doorstep.</p>
<p style="margin:0;font-size:11px;color:#bbb;">© ${new Date().getFullYear()} GreenCart. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function newsletterHTML(content) {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:#009a49;padding:24px 32px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">Gree<span style="color:#fff;font-weight:300;">n</span>Cart</h1>
<p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Newsletter</p>
</td></tr>

<!-- Content -->
<tr><td style="padding:32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="background:#f9f9f9;padding:20px 32px;text-align:center;">
<p style="margin:0 0 8px;font-size:12px;color:#aaa;line-height:1.5;">
You're receiving this because you subscribed to GreenCart newsletters.<br>
<a href="${CLIENT_URL}/unsubscribe?email={{EMAIL}}" style="color:#009a49;text-decoration:none;font-weight:600;">Unsubscribe</a>
</p>
<p style="margin:0;font-size:11px;color:#bbb;">© ${new Date().getFullYear()} GreenCart. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(userEmail, order, userName) {
    const html = orderConfirmationHTML(order, userName);
    return sendEmail({
        to: userEmail,
        subject: `Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()}`,
        html,
    });
}

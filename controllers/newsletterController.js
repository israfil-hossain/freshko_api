import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import SentNewsletter from '../models/SentNewsletter.js';
import { sendEmail, newsletterHTML } from '../services/emailService.js';

export const subscribe = async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.json({ success: false, message: 'Email is required' });
        }

        const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
        if (existing) {
            if (!existing.isActive) {
                existing.isActive = true;
                existing.unsubscribedAt = null;
                await existing.save();
                return res.json({ success: true, message: 'Subscription reactivated' });
            }
            return res.json({ success: true, message: 'Already subscribed' });
        }

        await NewsletterSubscriber.create({ email: email.toLowerCase(), name });
        res.json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const unsubscribe = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.json({ success: false, message: 'Email is required' });
        }

        const subscriber = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
        if (!subscriber) {
            return res.json({ success: false, message: 'Email not found' });
        }

        subscriber.isActive = false;
        subscriber.unsubscribedAt = new Date();
        await subscriber.save();
        res.json({ success: true, message: 'Unsubscribed successfully' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const listSubscribers = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status === 'active') filter.isActive = true;
        else if (status === 'inactive') filter.isActive = false;

        const subscribers = await NewsletterSubscriber.find(filter).sort({ subscribedAt: -1 });
        res.json({ success: true, subscribers });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        await NewsletterSubscriber.findByIdAndDelete(id);
        res.json({ success: true, message: 'Subscriber deleted' });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const sendNewsletter = async (req, res) => {
    try {
        const { subject, body, recipientIds } = req.body;
        if (!subject || !body) {
            return res.json({ success: false, message: 'Subject and body are required' });
        }

        let subscribers;
        if (recipientIds && recipientIds.length > 0) {
            subscribers = await NewsletterSubscriber.find({ _id: { $in: recipientIds }, isActive: true });
        } else {
            subscribers = await NewsletterSubscriber.find({ isActive: true });
        }

        if (subscribers.length === 0) {
            return res.json({ success: false, message: 'No active subscribers' });
        }

        const failedEmails = [];
        const sentTo = [];
        const htmlBody = newsletterHTML(body);

        for (const sub of subscribers) {
            const ok = await sendEmail({ to: sub.email, subject, html: htmlBody });
            if (ok) {
                sentTo.push(sub.email);
            } else {
                failedEmails.push(sub.email);
            }
        }

        await SentNewsletter.create({ subject, body, sentTo: sentTo.length });

        res.json({
            success: true,
            message: `Sent to ${sentTo.length} subscribers${failedEmails.length ? `, ${failedEmails.length} failed` : ''}`,
            sent: sentTo.length,
            failed: failedEmails.length,
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const getSentNewsletters = async (req, res) => {
    try {
        const newsletters = await SentNewsletter.find({}).sort({ sentAt: -1 });
        res.json({ success: true, newsletters });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

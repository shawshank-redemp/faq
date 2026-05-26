const Notification = require('../models/Notification');
const { paginate, buildPaginationMeta } = require('../utils/helpers');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query.page, req.query.limit);
    const filter = { recipient: req.user._id, isArchived: false };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false, isArchived: false });

    res.json({ notifications, unreadCount, pagination: buildPaginationMeta(total, page, limit) });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (ids && Array.isArray(ids)) {
      await Notification.updateMany(
        { _id: { $in: ids }, recipient: req.user._id },
        { isRead: true, readAt: new Date() },
      );
    } else {
      await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() },
      );
    }
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.archiveNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isArchived: true },
    );
    res.json({ message: 'Notification archived' });
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false, isArchived: false });
    res.json({ count });
  } catch (err) {
    res.json({ count: 0 });
  }
};

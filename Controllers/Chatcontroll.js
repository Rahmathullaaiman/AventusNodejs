const pool = require('../DATABASE/connection');
const { getReceiverSocketId, io } = require('../SOCKET/socketconfig');


exports.sendMessage = async (req, res) => {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    try {
    const insertMessageQuery = `
            INSERT INTO chat (sender_id, receiver_id, message)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
 const insertMessageResult = await pool.query(insertMessageQuery, [senderId, receiverId, message]);
           const newMessage = insertMessageResult.rows[0];
    const receiverSocketId = getReceiverSocketId(receiverId);
              if (receiverSocketId) {
io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(200).json(newMessage);
    } catch (err) {
        res.status(400).json({ error: `Failed to send message due to: ${err}` });
    }
};
//______________________________________________________________________________________________________
exports.getMessages = async (req, res) => {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;
    try {
        const messagesQuery = `
            SELECT * FROM chat
            WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
            ORDER BY created_at ASC;
        `;
        const messagesResult = await pool.query(messagesQuery, [senderId, userToChatId]);
        const messages = messagesResult.rows;
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: `Failed to get messages due to: ${err}` });
}
};
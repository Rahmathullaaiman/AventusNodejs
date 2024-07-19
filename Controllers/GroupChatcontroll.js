const pool = require('../DATABASE/connection');
const { getReceiverSocketId, io } = require('../SOCKET/socketconfig');

exports.createGroup = async (req, res) => {
    const { groupName, members } = req.body;
    const creatorId = req.user._id;

 try {
        const newGroupQuery = `
            INSERT INTO groups (name, members, profilePic, about, messages)
            VALUES ($1, $2, '', '', '[]'::jsonb)
            RETURNING *;
        `;
        const result = await pool.query(newGroupQuery, [groupName, [...members, creatorId]]);
        const newGroup = result.rows[0];

        res.status(200).json(newGroup);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "An error occurred while creating the group." });
    }
};
//___________________________________________________________________________________________________
exports.addMembers = async (req, res) => {
    const { groupId } = req.params;
    const { members } = req.body;

    try {
        const groupQuery = 'SELECT * FROM groups WHERE id = $1';
        const groupResult = await pool.query(groupQuery, [groupId]);
        const group = groupResult.rows[0];

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const existingMembers = members.filter(member => group.members.includes(member));

        if (existingMembers.length > 0) {
            return res.status(400).json({ error: "Users already added: " + existingMembers.join(", ") });
        }

        const updatedMembers = [...group.members, ...members];
        const updateMembersQuery = `
            UPDATE groups 
            SET members = $1 
            WHERE id = $2 
            RETURNING *;
        `;
        const updateResult = await pool.query(updateMembersQuery, [updatedMembers, groupId]);
        const updatedGroup = updateResult.rows[0];

        res.status(200).json(updatedGroup);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while adding members." });
    }
};
//________________________________________________________________________________________________________
exports.removeMembers = async (req, res) => {
    const { groupId } = req.params;
    const { members } = req.body;

    try {
        const groupQuery = 'SELECT * FROM groups WHERE id = $1';
        const groupResult = await pool.query(groupQuery, [groupId]);
        const group = groupResult.rows[0];

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const membersToRemove = members.filter(member => group.members.includes(member));

        if (membersToRemove.length === 0) {
            return res.status(400).json({ error: "No valid members to remove." });
        }

        const updatedMembers = group.members.filter(member => !members.includes(member));
        const updateMembersQuery = `
            UPDATE groups 
            SET members = $1 
            WHERE id = $2 
            RETURNING *;
        `;
        const updateResult = await pool.query(updateMembersQuery, [updatedMembers, groupId]);
        const updatedGroup = updateResult.rows[0];

        res.status(200).json({ message: "Members removed successfully", group: updatedGroup });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while removing members." });
    }
};
//___________________________________________________________________________________________________

exports.updateGroupSettings = async (req, res) => {
    const { groupId } = req.params;
    const { groupName, about } = req.body;
    const uploadedImage = req.file ? req.file.filename : '';

    try {
        const groupQuery = 'SELECT * FROM groups WHERE id = $1';
        const groupResult = await pool.query(groupQuery, [groupId]);
        const group = groupResult.rows[0];

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const updatedGroup = {
            ...group,
            name: groupName || group.name,
            profilePic: uploadedImage || group.profilePic,
            about: about || group.about
        };

        const updateGroupQuery = `
            UPDATE groups 
            SET name = $1, profilePic = $2, about = $3 
            WHERE id = $4 
            RETURNING *;
        `;
        const updateResult = await pool.query(updateGroupQuery, [updatedGroup.name, updatedGroup.profilePic, updatedGroup.about, groupId]);

        res.status(200).json(updateResult.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while updating group settings." });
    }
};
//___________________________________________________________________________________________________

exports.sendGroupMessage = async (req, res) => {
    const { message, groupId } = req.body;
    const senderId = req.user._id;

    try {
        const groupQuery = 'SELECT * FROM groups WHERE id = $1';
        const groupResult = await pool.query(groupQuery, [groupId]);
        const group = groupResult.rows[0];

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const newMessage = {
            senderId,
            message,
            timestamp: new Date(),
        };

        const updatedMessages = [...group.messages, newMessage];
        const updateMessagesQuery = `
            UPDATE groups 
            SET messages = $1 
            WHERE id = $2 
            RETURNING *;
        `;
        const updateResult = await pool.query(updateMessagesQuery, [JSON.stringify(updatedMessages), groupId]);
        const updatedGroup = updateResult.rows[0];

        group.members.forEach(memberId => {
            const receiverSocketId = getReceiverSocketId(memberId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newGroupMessage", newMessage);
            }
        });

        res.status(200).json(newMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while sending the message." });
    }
};
//___________________________________________________________________________________________________

exports.getGroupMessages = async (req, res) => {
    const { groupId } = req.params;

    try {
        const groupQuery = 'SELECT * FROM groups WHERE id = $1';
        const groupResult = await pool.query(groupQuery, [groupId]);
        const group = groupResult.rows[0];

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.status(200).json(group.messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching messages." });
    }
};
//___________________________________________________________________________________________________

exports.deleteGroup = async (req, res) => {
    const { groupId } = req.params;

    try {
        const deleteGroupQuery = 'DELETE FROM groups WHERE id = $1 RETURNING *';
        const deleteResult = await pool.query(deleteGroupQuery, [groupId]);
        const deletedGroup = deleteResult.rows[0];

        if (!deletedGroup) {
            return res.status(404).json({ error: "Group not found" });
        }

        res.status(200).json({ message: "Group deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while deleting the group." });
    }
};

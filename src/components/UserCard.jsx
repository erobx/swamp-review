import { Box, Typography, Card, Modal, ModalDialog, Button, IconButton } from '@mui/joy';
import { Save as SaveIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import UserIcon from './UserIcon';
import TagList from './TagList';
import { getUser } from '../functions/userQueries';
import { getAllTags, getTagsForUser, updateTagsForUser } from '../functions/tagQueries';
import CustomChip from './CustomChip';

const UserCard = ({ user_id, isEditable = false, onClick }) => {
  const [user, setUser] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      const userRes = await getUser(user_id);
      setUser(userRes);

      const userTagsRes = await getTagsForUser(user_id);
      setUserTags(userTagsRes);
      setSelectedTags(userTagsRes.map((tag) => tag.id));

      if (isEditable) {
        const tagsRes = await getAllTags();
        setTags(tagsRes);
      }
    } catch (error) {
      console.error("Error fetching user data or tags:", error);
    }
  };

  const handleTagClick = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : prev.length < 5
        ? [...prev, tagId]
        : prev
    );
  };

  const handleTagSave = async () => {
    if (isSaving) return; // Prevent duplicate save actions
    setIsSaving(true);

    try {
      await updateTagsForUser(user_id, selectedTags);

      // Reload the updated tags
      const userTagsRes = await getTagsForUser(user_id);
      setUserTags(userTagsRes);
      setShowModal(false);
    } catch (error) {
      console.error("Error saving tags:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        width: "100%",
        transition: "all 0.2s",
        padding: 0,
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px" }}>
        <UserIcon height={60} width={60} user={user}/>
        <Box sx={{ textAlign: "center", marginTop: "8px" }}>
          <Typography level="h6" sx={{ fontWeight: "bold" }}>
            {user.first_name} {user.last_name}
          </Typography>
          <Typography level="body2" sx={{ color: "neutral.600" }}>
            Year: {user.year}
          </Typography>
          <Typography level="body2" sx={{ color: "neutral.600" }}>
            Major: {user.major}
          </Typography>
        </Box>
        <Typography level="body2" sx={{ color: "neutral.600" }}>
          Tag Preferences:
        </Typography>
        {userTags.length === 0 && (
          <Typography level="body-sm" sx={{ color: "neutral.600" }}>
            No tags selected
          </Typography>
        )}
        <TagList tags={userTags} maxVisibleTags={5} />
      </Box>

      {isEditable && (
        <Button
          onClick={() => setShowModal(true)}
          sx={{
            width: "100%",
            borderRadius: 0,
            borderTop: "1px solid",
            borderColor: "neutral.200",
          }}
        >
          Edit My Tag Preferences
        </Button>
      )}

      {/* Modal for Editing Tags */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <ModalDialog>
          <Box sx={{ padding: "1rem", borderRadius: "8px", maxWidth: "400px", width: "90%" }}>
            <Typography level="body-md" fontWeight="xl">
              Select Tags
            </Typography>
            <Typography level="body-sm" sx={{ marginBottom: "0.5rem" }}>
              Please select any tags that you feel accurately describe your preferences. Maximum of
              5 tags:
            </Typography>
            <Box sx={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {tags.map((tag) => (
                <CustomChip
                  key={tag.id}
                  name={tag.name}
                  active={selectedTags.includes(tag.id)}
                  onClick={() => handleTagClick(tag.id)}
                />
              ))}
            </Box>
              <Button
                onClick={handleTagSave}
                disabled={isSaving}
                sx={{
                  width: "100%",
                  borderRadius: 0,
                  borderTop: "1px solid",
                  borderColor: "neutral.200",
                }}
              >
                Save
              </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Card>
  );
};

export default UserCard;
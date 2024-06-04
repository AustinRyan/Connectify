import { motion } from "framer-motion";
import { useRouter } from "next/router";

const Modal = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNavigation = (path) => {
    onClose(); // Close the modal
    setTimeout(() => {
      router.push(path); // Navigate to the intended page after a short delay
    }, 300); // Adjust the delay as needed
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-black">
          Sign Up or Sign In
        </h2>
        <p className="mb-4 text-black">
          To be able to make tweets, follow users, direct message, edit your
          profile page and more, you need to sign up! (You can use fake email
          and password, no verification needed!)
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
          <button
            onClick={() => handleNavigation("/auth/signup")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign Up
          </button>
          <button
            onClick={() => handleNavigation("/auth/signin")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Sign In
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Modal;

const { Book , User } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');


const resolvers = {
    Query: {
        users: async () => {
          return User.find().populate('books');
        },
        user: async (parent, { username }) => {
          return User.findOne({ username }).populate('books');
        },
        books: async (parent, { username }) => {
          const params = username ? { username } : {};
          return Book.find(params).sort({ createdAt: -1 });
        },
        book: async (parent, { bookId }) => {
          return Book.findOne({ _id: bookId });
        },
        me: async (parent, args, context) => {
          if (context.user) {
            return User.findOne({ _id: context.user._id }).populate('books');
          }
          throw AuthenticationError;
        },
      },
    
    Mutation:{
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
          },
          login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
      
            if (!user) {
              throw AuthenticationError;
            }
      
            const correctPw = await user.isCorrectPassword(password);
      
            if (!correctPw) {
              throw AuthenticationError;
            }
      
            const token = signToken(user);
      
            return { token, user };
          },
          saveBook: async (parent, { bookId, author, description, title, image, link }, context) => {
            if (context.user) {
              const book = await Book.create({
                _id: bookId,
                author,
                description,
                title, 
                image,
                link,
              });
      
              await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { books: book._id } }
              );
      
              return book;
            }
            throw new AuthenticationError('You need to be logged in!');
          },
          removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
              try {
                const book = await Book.findOneAndDelete({ _id: bookId });
                await User.findOneAndUpdate(
                  { _id: context.user._id },
                  { $pull: { books: bookId } }
                );
                return book;
              } catch (error) {
                // Handle error appropriately
                throw new Error('Could not remove book');
              }
            }
            throw new AuthenticationError('You need to be logged in!');
          },
    },
};
module.exports = resolvers;

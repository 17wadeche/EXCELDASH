// user/index.js or userRoute.js
module.exports = async function (context, req) {
    const search = req.query.search || '';
    const { User } = await initializeModels();
  
    if (!search) {
      context.res = { status: 200, body: [] };
      return;
    }
    const users = await User.findAll({
      where: {
        userEmail: { [Op.like]: `%${search}%` }
      },
      limit: 20,
    });
  
    context.res = { status: 200, body: users };
  };
  
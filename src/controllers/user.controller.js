import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {

    /*
    1. get user details from req.body
    2. validate user details
    3. check if user already exist with the email or username
    4. check for images to server
    5. upload images to cloudinary
    6. create user
    7. remove password and refresh token from user object
    8. check for user creation
    9. send response

    */

    // get user details from req.body
    const { username, email, password, fullName } = req.body

    // validate user details
    if (
        [username, email, password, fullName].some((field) => {
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exist with the email or username
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "username or email already exist")
    }

    // check avatar in server
    const avatarLocalPath = req.files?.avatar[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar is required")
    }

    // check coverImage in server
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    // upload images to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // check avatar upload to cloudinary because avatar is required
    if (!avatar) {
        throw new ApiError(409, "Avatar is required")
    }

    // create user in database
    const createdUser = await User.create({

        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    // remove password, refresh token and watch History from user object
    const user = await User.findOne(createdUser._id).select("-password -refreshToken -watchHistory")

    // check for user creation
    if (!user) {
        throw new ApiError(500, "Something went wrong, while creating user")
    }

    // send response
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "User created successfully"
            )
        )


})

export { registerUser }
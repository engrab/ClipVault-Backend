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

    const { username, email, password, fullName } = req.body

    if (
        [username, email, password, fullName].some((field) => {
            field?.trime() === ""
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [username, email]
    })

    if (existedUser) {
        throw new ApiError(409, "username or email already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar is required")
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(409, "Avatar is required")
    }

    const createdUser = await User.create({

        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()

    })

    const user = await User.findOne(createdUser._id).select("-password -refreshToken -watchHistory")

    if (!user) {
        throw new ApiError(500, "Something went wrong, while creating user")
    }

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